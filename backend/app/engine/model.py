import os
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)

from app.engine.generator import generate_synthetic_dataset
from app.engine.features import FEATURE_NAMES

logger = logging.getLogger("streamshield.engine")

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "weights")
MODEL_PATH = os.path.join(WEIGHTS_DIR, "xgb_fraud_model.joblib")

# Try XGBoost, fallback to scikit-learn GradientBoosting if dynamic lib issue
try:
    from xgboost import XGBClassifier
    DEFAULT_ESTIMATOR = "XGBoost"
except Exception as e:
    logger.warning(f"XGBoost import warning ({e}), using scikit-learn GradientBoosting.")
    from sklearn.ensemble import GradientBoostingClassifier
    DEFAULT_ESTIMATOR = "GradientBoosting"


class FraudDetectionModel:
    def __init__(self):
        self.model = None
        self.metadata: Dict[str, Any] = {}
        self.estimator_name = DEFAULT_ESTIMATOR
        self._ensure_model_loaded()

    def _ensure_model_loaded(self):
        """Loads existing serialized model or trains fresh baseline."""
        if os.path.exists(MODEL_PATH):
            try:
                bundle = joblib.load(MODEL_PATH)
                self.model = bundle["model"]
                self.metadata = bundle["metadata"]
                self.estimator_name = bundle.get("estimator", DEFAULT_ESTIMATOR)
                logger.info(f"Loaded existing fraud model '{self.estimator_name}' trained at {self.metadata.get('trained_at')}.")
                return
            except Exception as exc:
                logger.warning(f"Could not load serialized model ({exc}), retraining fresh model.")

        # Train initial model
        self.train_and_evaluate(n_samples=2500)

    def train_and_evaluate(self, n_samples: int = 2500) -> Dict[str, Any]:
        """
        Trains model on synthetic UPI behavioral transaction fixtures,
        evaluates on held-out test split, and serializes artifacts.
        """
        logger.info(f"Generating {n_samples} synthetic training records...")
        X, y, _ = generate_synthetic_dataset(n_samples=n_samples, fraud_ratio=0.08, random_seed=42)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42, stratify=y
        )

        logger.info(f"Fitting {self.estimator_name} classifier on {len(X_train)} samples...")
        if self.estimator_name == "XGBoost":
            clf = XGBClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.08,
                subsample=0.85,
                colsample_bytree=0.85,
                eval_metric="logloss",
                n_jobs=2,
                random_state=42,
            )
        else:
            clf = GradientBoostingClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.08,
                random_state=42,
            )

        clf.fit(X_train, y_train)

        # Empirical Evaluation on Test Split
        y_pred = clf.predict(X_test)
        y_prob = clf.predict_proba(X_test)[:, 1]

        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()

        precision = float(precision_score(y_test, y_pred, zero_division=0))
        recall = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        roc_auc = float(roc_auc_score(y_test, y_prob))
        fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

        # Feature importances
        if hasattr(clf, "feature_importances_"):
            importances = {
                name: round(float(imp), 4)
                for name, imp in zip(FEATURE_NAMES, clf.feature_importances_)
            }
            # Sort descending
            sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))
        else:
            sorted_importances = {}

        self.model = clf
        self.metadata = {
            "model_architecture": f"{self.estimator_name}-UPI-Fraud-v1.0",
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "fraud_prevalence": 0.08,
            "metrics": {
                "precision": round(precision * 100, 2),
                "recall": round(recall * 100, 2),
                "f1_score": round(f1, 4),
                "false_positive_rate": round(fpr * 100, 3),
                "roc_auc": round(roc_auc, 4),
                "confusion_matrix": {
                    "true_positive": int(tp),
                    "false_positive": int(fp),
                    "false_negative": int(fn),
                    "true_negative": int(tn),
                    "total_evaluated": int(len(y_test)),
                },
            },
            "feature_importances": sorted_importances,
            "is_simulated_benchmark": True,
        }

        os.makedirs(WEIGHTS_DIR, exist_ok=True)
        joblib.dump(
            {
                "model": self.model,
                "metadata": self.metadata,
                "estimator": self.estimator_name,
            },
            MODEL_PATH,
        )

        logger.info(
            f"Trained {self.estimator_name} - F1: {f1:.4f}, Recall: {recall*100:.1f}%, Precision: {precision*100:.1f}%, FPR: {fpr*100:.3f}%"
        )
        return self.metadata

    def predict(self, feature_vector: np.ndarray) -> Tuple[int, float]:
        """
        Runs model inference on feature vector.
        Returns:
            risk_score (int 0-100), fraud_probability (float 0.0-1.0)
        """
        if self.model is None:
            self._ensure_model_loaded()

        X_input = feature_vector.reshape(1, -1)
        prob = float(self.model.predict_proba(X_input)[0, 1])
        risk_score = int(np.clip(np.round(prob * 100), 0, 100))
        return risk_score, prob

    def get_evaluation_report(self) -> Dict[str, Any]:
        """Returns the empirical evaluation report."""
        return self.metadata


# Global singleton instance
fraud_model = FraudDetectionModel()

"use client";

import { useState, useCallback } from "react";

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function useConfirm() {
  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    type: "danger",
    loading: false
  });

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: "danger" | "warning" | "info";
      onCancel?: () => void;
    }
  ) => {
    setConfirm({
      isOpen: true,
      title,
      message,
      confirmText: options?.confirmText || "Xác nhận",
      cancelText: options?.cancelText || "Hủy",
      type: options?.type || "danger",
      loading: false,
      onConfirm,
      onCancel: options?.onCancel
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirm(prev => ({ ...prev, isOpen: false }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setConfirm(prev => ({ ...prev, loading }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirm.onConfirm) {
      confirm.onConfirm();
    }
  }, [confirm.onConfirm]);

  const handleCancel = useCallback(() => {
    if (confirm.onCancel) {
      confirm.onCancel();
    }
    hideConfirm();
  }, [confirm.onCancel, hideConfirm]);

  return {
    confirm,
    showConfirm,
    hideConfirm,
    setLoading,
    handleConfirm,
    handleCancel
  };
}

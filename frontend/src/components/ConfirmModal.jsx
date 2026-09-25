function ConfirmModal({ title, message, confirmLabel = 'Confirm', confirmColor = 'red', onConfirm, onCancel }) {
  const confirmClasses = confirmColor === 'red'
    ? 'bg-red-400 hover:bg-red-500'
    : 'bg-[#D88C9A] hover:bg-[#C77B8C]';

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-[#3A3335] mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
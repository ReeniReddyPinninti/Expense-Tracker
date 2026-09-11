function Toast({ message, type = 'success', onClose }) {
  const bgColor = type === 'success' ? '#D88C9A' : '#E57373';

  return (
    <div
      className="fixed bottom-6 right-6 z-50 text-white text-sm px-4 py-3 rounded-lg shadow-lg animate-toast"
      style={{ backgroundColor: bgColor }}
      onClick={onClose}
    >
      {message}
    </div>
  );
}

export default Toast;
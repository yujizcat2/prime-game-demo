import "./ActionToast.css";

export default function ActionToast({toast}){
  if(!toast)return null;

  return (
    <div className="action-toast-layer" aria-live="polite" aria-atomic="true">
      <div className="action-toast" key={toast.id} role="status">
        <strong>{toast.title}</strong>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

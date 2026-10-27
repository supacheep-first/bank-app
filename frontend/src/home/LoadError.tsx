import { ERROR_MESSAGE } from '../api'
import './LoadError.css'

export default function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="wrap">
      <div className="splash">
        <p className="load-error__text" role="alert">
          {ERROR_MESSAGE}
        </p>
        <button type="button" className="load-error__retry" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  )
}

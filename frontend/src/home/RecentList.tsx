import type { RecentItem } from '../api'

// Rows are not unique (the same name can come back twice), so index is the key. Go already sorts and caps at 10.
// A broken image hides itself and leaves the grey circle of .rctly__thumb.
export default function RecentList({ items }: { items: RecentItem[] }) {
  return (
    <div className="rctly__wrap main-loading main-loading--order5">
      <ul className="rctly__lst">
        {items.map(({ name, image }, i) => (
          <li key={i} className="rctly__item">
            <button type="button" className="rctly__link">
              <span className="rctly__thumb">
                <img src={image} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </span>
              <span className="rctly__name">{name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

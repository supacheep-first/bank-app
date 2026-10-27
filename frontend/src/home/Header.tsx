// ☰ and ✕ lead nowhere in this app, so the buttons do nothing
export default function Header() {
  return (
    <header className="header">
      <button type="button" className="header__lft header__menu">
        <span className="blind">Menu</span>
      </button>
      <button type="button" className="header__rgt header__cxl">
        <span className="blind">Cancel</span>
      </button>
    </header>
  )
}

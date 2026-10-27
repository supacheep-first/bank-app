import type { BannerItem } from '../api'

// th-bank.css gives .main-prod__cms-ico no background, so the grey circle for a broken image is inline here.
// The button is a flex item of .content_wrap (stretches); only the text alignment needs restating.
export default function Banner({ title, description, image }: BannerItem) {
  return (
    <button type="button" className="main-prod" style={{ textAlign: 'left' }}>
      <span className="main-prod__cms-ico" style={{ borderRadius: '50%', background: '#d0dae4' }}>
        <img src={image} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
      </span>
      <strong className="main-prod__tit">{title}</strong>
      <span className="main-prod__dsc" style={{ display: 'block' }}>
        {description}
      </span>
    </button>
  )
}

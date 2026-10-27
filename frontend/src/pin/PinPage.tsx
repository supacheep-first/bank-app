import { useProfile } from '../hooks'

export default function PinPage() {
  const { name } = useProfile()
  return (
    <div className="wrap">
      <main className="container container--pin-type">
        <div className="pin">
          <div className="pin__top">
            <span className="pin__photo" />
            <h1 className="pin__name">{name}</h1>
          </div>
        </div>
      </main>
    </div>
  )
}

import { Link, useLocation } from 'react-router-dom'
import './InterestTypeLink.css'

export default function InterestTypeLink({ children = '흥미 유형 살펴보러 가기' }) {
  const location = useLocation()
  return (
    <Link to="/interest-types" state={{ from: `${location.pathname}${location.search}`, returnState: location.state }} className="interest-type-link">
      {children}<span aria-hidden="true">↗</span>
    </Link>
  )
}

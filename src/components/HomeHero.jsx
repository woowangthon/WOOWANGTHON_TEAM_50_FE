import telescope from '../assets/telescope-hero.webp'
import './HomeHero.css'

// 홈 맨 위 배너: 한 줄 소개 + 3D 망원경 그림. 화면 폭 전체 배경, 글은 본문 폭(1200px) 안에 둡니다.
// 망원경 그림은 받은 3D 이미지에서 흰 배경을 지워 투명하게 만든 것(900×504)입니다. 장식이라 alt를 비웁니다.
export default function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-inner app-container">
        <div className="home-hero-text">
          <p className="home-hero-eyebrow">나를 알아가는 작은 발견</p>
          <h1 id="home-hero-title">오늘의 발견이, 나의 방향이 되도록.</h1>
          <p className="home-hero-lead">하루 다섯 장의 카드로 나다운 가능성을 찾아보세요.</p>
        </div>
        <img className="home-hero-art" src={telescope} alt="" width="900" height="504" decoding="async" />
      </div>
    </section>
  )
}

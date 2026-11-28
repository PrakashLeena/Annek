/* Every public page except /solutions/* (SolutionsPage.jsx). Copy for H1s and intros: src/seo/pages.js. */
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Solutions from "../site/Solutions";
import Products from "../site/Products";
import { useSiteData } from "../site/SiteData";
import { STRIP, companyInfo } from "../site/content";
import { money } from "../utils/format";
import { HASH_REDIRECTS, PAGES } from "../seo/pages";
import {
  PageHero, MoreLink, Related, ServiceCards, HowItWorks, PortfolioTeaser, PortfolioGrid, WebsitePlans,
  MaintenancePlans, ReviewsTeaser, ReviewsFull, FaqList, AboutTeaser, AboutFull, ContactBlock,
} from "../site/sections";

/* Old one-page links such as /#services → /services, so shared links keep working. */
function useHashRedirect() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const to = HASH_REDIRECTS[decodeURIComponent(hash.slice(1))];
    if (to) navigate(to, { replace: true });
    else if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash, navigate]);
}

export function Home() {
  useHashRedirect();
  const { settings, catalog, products, openOrder } = useSiteData();
  const company = companyInfo(settings);
  const featured = catalog?.packages?.find((p) => p.highlighted) || catalog?.packages?.[0];

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="pill"><span className="dot" />{company.area}</span>
            <h1>Software Development Company <span>in Sri Lanka</span></h1>
            <p className="lead">Mobile apps, web apps and software, built and looked after. Pick a ready made solution: we customise it to your business, launch it, and keep it secure and up to date with a monthly maintenance plan.</p>
            <div className="hero-ctas">
              <Link to="/services" className="btn btn-orange btn-lg">Explore services</Link>
              <button type="button" className="btn btn-line btn-lg" onClick={() => openOrder("")}>Tell us what you need</button>
            </div>
            <ul className="hero-ticks"><li>Mobile apps</li><li>Web applications</li><li>Custom software</li><li>Monthly care</li></ul>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-card" style={{ background: "#050505" }}>
              <img src="/intro/annek-intro-poster.jpg" alt="" width="1280" height="720" fetchPriority="high" style={{ objectFit: "contain" }} />
            </div>
            <div className="hero-float">
              {featured ? (
                <>
                  <small>Featured package</small>
                  <strong>{featured.name}</strong>
                  <span>{money(featured.setupPrice, featured.currency)} setup + {money(featured.monthlyFee, featured.currency)}/mo</span>
                </>
              ) : (
                <>
                  <small>Every package</small>
                  <strong>Built for you</strong>
                  <span>Customised, launched and maintained by Annek.</span>
                </>
              )}
            </div>
            <div className="hero-tag">Maintained monthly</div>
          </div>
        </div>
      </section>

      <div className="strip" aria-hidden="true">
        <div className="strip-track">{[...STRIP, ...STRIP].map((t, i) => <span key={i}>{t}</span>)}</div>
      </div>

      <section className="section" aria-labelledby="services-title">
        <div className="wrap">
          <div className="head-row reveal">
            <div style={{ maxWidth: 640 }}>
              <div className="eyebrow">What we build</div>
              <h2 className="h2" id="services-title">Software, web apps and mobile apps for your business</h2>
            </div>
            <p className="lead">Start from a proven solution or build something new. Either way it comes with monthly maintenance.</p>
          </div>
          <ServiceCards />
          <MoreLink to="/services">View all services and packages</MoreLink>
        </div>
      </section>

      <HowItWorks id="how-it-works" />

      <Products products={products} onOrder={openOrder} limit={2}
        more={products.length > 0 && <MoreLink to="/products">See all products</MoreLink>} />

      <PortfolioTeaser />

      <section className="section" aria-labelledby="pricing-title">
        <WebsitePlans />
        <div className="wrap"><MoreLink to="/pricing">See all pricing</MoreLink></div>
      </section>

      <ReviewsTeaser />
      <AboutTeaser />
      <ContactBlock />
    </>
  );
}

export function ServicesPage() {
  const { catalog, openOrder } = useSiteData();
  return (
    <>
      <PageHero page={PAGES.services} />
      <Solutions catalog={catalog} onOrder={openOrder} showMaintenance={false} />
      <HowItWorks />
      <Related links={[["/pricing", "Pricing and maintenance plans"], ["/portfolio", "See our work"], ["/faq", "Questions and answers"]]} />
    </>
  );
}

export function ProductsPage() {
  const { products, openOrder } = useSiteData();
  return (
    <>
      <PageHero page={PAGES.products} />
      {products.length > 0
        ? <Products products={products} onOrder={openOrder} eyebrow={null} title="All products" />
        : <section className="section" style={{ paddingTop: 0 }}><div className="wrap"><p className="lead">Our first products are on the way. <Link to="/contact">Contact us</Link> to hear when they launch.</p></div></section>}
      <Related links={[["/services", "Services for your business"], ["/portfolio", "Client projects"], ["/contact", "Contact Annek"]]} />
    </>
  );
}

export function PortfolioPage() {
  return (
    <>
      <PageHero page={PAGES.portfolio} />
      <PortfolioGrid />
      <Related links={[["/services", "Our services"], ["/reviews", "What clients say"], ["/pricing", "Pricing"]]} />
    </>
  );
}

export function ReviewsPage() {
  return (
    <>
      <PageHero page={PAGES.reviews} />
      <ReviewsFull />
      <Related links={[["/portfolio", "See the work behind the reviews"], ["/services", "Our services"], ["/contact", "Contact Annek"]]} />
    </>
  );
}

export function PricingPage() {
  return (
    <>
      <PageHero page={PAGES.pricing} />
      <section className="section" style={{ paddingTop: 24 }} aria-labelledby="pricing-title">
        <WebsitePlans title="Website builds" headingLevel={2} />
      </section>
      <MaintenancePlans />
      <section className="section" aria-labelledby="packages-title">
        <div className="wrap">
          <h2 className="h2" id="packages-title" style={{ marginBottom: 16 }}>Apps, web applications and software</h2>
          <p className="lead" style={{ maxWidth: 680 }}>Mobile apps, web applications and custom software are priced as packages with a setup fee and a monthly maintenance fee, or quoted for your project. <Link to="/services">Browse the packages</Link> or <Link to="/contact">ask for a quote</Link>.</p>
        </div>
      </section>
      <Related links={[["/services", "Services and packages"], ["/faq", "Pricing questions"], ["/contact", "Get a quote"]]} />
    </>
  );
}

export function AboutPage() {
  return (
    <>
      <PageHero page={PAGES.about} />
      <AboutFull />
      <Related links={[["/portfolio", "Our work"], ["/reviews", "Client reviews"], ["/contact", "Contact Annek"]]} />
    </>
  );
}

export function FaqPage() {
  return (
    <>
      <PageHero page={PAGES.faq} />
      <section className="section" style={{ paddingTop: 0 }} aria-label="Questions and answers">
        <div className="wrap faq-page"><FaqList title={null} /></div>
      </section>
      <Related links={[["/services", "Our services"], ["/pricing", "Pricing"], ["/contact", "Ask us anything else"]]} />
    </>
  );
}

export function ContactPage() {
  return (
    <>
      <PageHero page={PAGES.contact} />
      <ContactBlock title={<>Send us a <span>message</span></>} />
      <Related cta={false} links={[["/services", "Our services"], ["/pricing", "Pricing"], ["/faq", "Frequently asked questions"]]} />
    </>
  );
}

import Image from "next/image";

export function LandingPrism({ active }: { active: boolean }) {
  return (
    <figure className="landing-artwork" aria-busy={active || undefined}>
      <div className="landing-artwork-image">
        <Image
          src="/images/prism-contained-v3.webp"
          alt="A sculptural glass prism refracting sunlight into a vivid spectrum on a white surface"
          fill
          priority
          sizes="(max-width: 800px) 100vw, 55vw"
          quality={90}
        />
      </div>
      <figcaption>
        <span>One source.</span>
        <span>A spectrum of possibilities.</span>
      </figcaption>
    </figure>
  );
}

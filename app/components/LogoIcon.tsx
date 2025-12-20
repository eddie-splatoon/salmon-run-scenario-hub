import Image from 'next/image'

interface LogoIconProps {
  size?: number
  className?: string
}

export default function LogoIcon({ size = 32, className = '' }: LogoIconProps) {
  return (
    <Image
      src="/logo.png"
      alt="Salmon Run Scenario Hub"
      width={size}
      height={size}
      className={className}
      priority
    />
  )
}


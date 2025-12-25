import Image from 'next/image'

/**
 * LogoIconコンポーネント
 * 
 * 注意: 本コンポーネントで使用されるロゴは、任天堂の公式ロゴや商標とは一切関係のない
 * 独自デザインのロゴです。任天堂のファンコンテンツガイドラインに準拠しています。
 */
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


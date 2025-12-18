'use client'

interface Weapon {
  weapon_id: number
  weapon_name: string
  icon_url: string | null
  display_order: number
}

interface ScenarioCardProps {
  code: string
  stageName: string
  dangerRate: number
  totalGoldenEggs: number
  weapons: Weapon[]
}

export default function ScenarioCard({
  code,
  stageName,
  dangerRate,
  totalGoldenEggs,
  weapons,
}: ScenarioCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      {/* シナリオコードと合計納品数 */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-100 mb-1">{code}</h3>
          <p className="text-sm text-gray-400">{stageName}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">{totalGoldenEggs}</div>
          <div className="text-xs text-gray-500">金イクラ</div>
        </div>
      </div>

      {/* キケン度 */}
      <div className="mb-3">
        <span className="text-sm text-gray-400">キケン度: </span>
        <span className="text-sm font-semibold text-red-400">{dangerRate}%</span>
      </div>

      {/* 武器アイコン4つ */}
      <div className="flex gap-2">
        {weapons.slice(0, 4).map((weapon, index) => (
          <div
            key={`${weapon.weapon_id}-${index}`}
            className="flex-1 bg-gray-700 rounded p-2 flex items-center justify-center min-h-[60px]"
            title={weapon.weapon_name}
          >
            {weapon.icon_url ? (
              <img
                src={weapon.icon_url}
                alt={weapon.weapon_name}
                className="w-full h-auto max-h-12 object-contain"
                onError={(e) => {
                  // 画像読み込み失敗時は武器名を表示
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `<span class="text-xs text-gray-300 text-center">${weapon.weapon_name}</span>`
                  }
                }}
              />
            ) : (
              <span className="text-xs text-gray-300 text-center">{weapon.weapon_name}</span>
            )}
          </div>
        ))}
        {/* 武器が4つ未満の場合、空のスロットを表示 */}
        {weapons.length < 4 &&
          Array.from({ length: 4 - weapons.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex-1 bg-gray-700/50 rounded p-2 flex items-center justify-center min-h-[60px] border-2 border-dashed border-gray-600"
            >
              <span className="text-xs text-gray-500">-</span>
            </div>
          ))}
      </div>
    </div>
  )
}


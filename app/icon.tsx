import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Cache busting: Updated on 2025-08-24
export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(45deg, #c9a96e, #f4e27a)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20%',
          border: '2px solid #8b7355',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
            fill="#8b4513"
            stroke="#5d2f0a"
            strokeWidth="1"
          />
          <path
            d="M12 3L14.5 7.5L19.5 8L16 12L17 17.5L12 15L7 17.5L8 12L4.5 8L9.5 7.5L12 3Z"
            fill="#ffd700"
            stroke="#b8860b"
            strokeWidth="0.5"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default async function AppleIcon() {
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
          border: '8px solid #8b7355',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <svg
          width="96"
          height="96"
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
          <circle cx="12" cy="8" r="1.5" fill="#ff6b6b" />
          <circle cx="9" cy="10" r="1" fill="#ff6b6b" />
          <circle cx="15" cy="10" r="1" fill="#ff6b6b" />
          <circle cx="12" cy="12" r="2" fill="#ff6b6b" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}

import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#c9a96e',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            background: 'radial-gradient(ellipse at center, rgba(201, 169, 110, 0.1) 0%, transparent 70%)',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              background: '#c9a96e',
              borderRadius: '50%',
              marginRight: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
            }}
          >
            👑
          </div>
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #c9a96e, #f4e27a, #c9a96e)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: 0,
            }}
          >
            BuyTheTop
          </h1>
        </div>
        <p
          style={{
            fontSize: '28px',
            color: '#e5e5e5',
            textAlign: 'center',
            maxWidth: '800px',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Premium Ranking Platform - Where Contributions Determine Your Position
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}


import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get('region') || 'Korea';
    const winner = searchParams.get('winner') || 'Voting in Progress';
    const color = searchParams.get('color') || '#3b82f6';

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    height: '100%',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    backgroundImage: 'linear-gradient(to bottom, #dbf4ff, #fff1f1)',
                    fontSize: 60,
                    letterSpacing: -2,
                    fontWeight: 700,
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        backgroundImage: 'linear-gradient(90deg, rgb(0, 124, 240), rgb(0, 178, 255))',
                        backgroundClip: 'text',
                        '-webkit-background-clip': 'text',
                        color: 'transparent',
                        marginBottom: 20,
                    }}
                >
                    VOTEMAP.LIVE
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'white',
                        padding: '20px 40px',
                        borderRadius: 30,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    }}
                >
                    <div style={{ color: color, marginRight: 20 }}>{region}</div>
                    <div style={{ fontSize: 40, color: '#666' }}>is currently</div>
                </div>
                <div style={{ marginTop: 30, fontSize: 80, fontWeight: 900 }}>
                    {winner}
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        },
    );
}

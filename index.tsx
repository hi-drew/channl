import { Button, Frog } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from '@hono/node-server/serve-static'
import { neynar } from 'frog/hubs'

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || 'NEYNAR_FROG_FM'

export const app = new Frog({
  title: 'Channel Explorer',
  imageOptions: {
    width: 1200,
    height: 630,
    fonts: [{ name: 'Inter', weight: 400, source: 'google' }],
  },
  hub: neynar({ apiKey: NEYNAR_API_KEY }),
})

async function fetchChannel(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch channel')
    const data = await response.json()
    return data.result.channels ? data.result.channels[Math.floor(Math.random() * data.result.channels.length)] : data.result.channel
  } catch (error) {
    console.error('Error fetching channel:', error)
    return null
  }
}

app.frame('/', (c) => {
  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#432889', fontFamily: 'Inter', color: 'white' }}>
        <h1 style={{ fontSize: 60, fontWeight: 'bold', marginBottom: 20 }}>Channel Explorer</h1>
        <p style={{ fontSize: 30, textAlign: 'center' }}>Discover new channels or explore your favorites!</p>
      </div>
    ),
    intents: [
      <Button action="/random">Random Channel</Button>,
      <Button action="/followed">Followed Channels</Button>,
    ]
  })
})

app.frame('/random', async (c) => {
  const channel = await fetchChannel('https://api.warpcast.com/v2/all-channels')
  return channelResponse(c, channel)
})

app.frame('/followed', async (c) => {
  const fid = c.frameData?.fid
  if (!fid) return authRequiredResponse(c)
  
  const channel = await fetchChannel(`https://api.warpcast.com/v1/user-following-channels?fid=${fid}`)
  return channelResponse(c, channel)
})

function channelResponse(c, channel) {
  if (!channel) return errorResponse(c)
  
  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#432889', fontFamily: 'Inter', color: 'white' }}>
        {channel.imageUrl && <img src={channel.imageUrl} width="200" height="200" style={{ borderRadius: '50%', marginBottom: 20 }} />}
        <h2 style={{ fontSize: 50, fontWeight: 'bold' }}>{channel.name || 'Unknown Channel'}</h2>
      </div>
    ),
    intents: [
      <Button.Link href={`https://warpcast.com/~/channel/${channel.id}`}>Visit Channel</Button.Link>,
      <Button action={c.url.pathname}>New Channel</Button>,
      <Button action="/">Back to Home</Button>,
    ]
  })
}

function errorResponse(c) {
  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#432889', fontFamily: 'Inter', color: 'white' }}>
        <h2 style={{ fontSize: 50, fontWeight: 'bold' }}>Error</h2>
        <p style={{ fontSize: 24, textAlign: 'center', maxWidth: '80%' }}>Unable to fetch channel. Please try again.</p>
      </div>
    ),
    intents: [<Button action="/">Back to Home</Button>]
  })
}

function authRequiredResponse(c) {
  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#432889', fontFamily: 'Inter', color: 'white' }}>
        <h2 style={{ fontSize: 50, fontWeight: 'bold' }}>Authentication Required</h2>
        <p style={{ fontSize: 24, textAlign: 'center', maxWidth: '80%' }}>Please sign in to view your followed channels.</p>
      </div>
    ),
    intents: [<Button action="/">Back to Home</Button>]
  })
}

devtools(app, { serveStatic })
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { Hono } from 'hono';
import OpenAI from 'openai';
import { Innertube } from 'youtubei.js';

const systemMessage = `
You will be provided with a YouTube video transcript. Your task is to create a concise, informative summary that captures the key points, main ideas, and essential information. Follow these guidelines:

- Identify the video's main topic and overall purpose.
- Extract 3-5 key points or main ideas discussed in the video.
- Highlight any important facts, statistics, or examples that support the main ideas.
- Note any significant conclusions or takeaways.
- Mention any notable guests, experts, or sources cited in the video.
- Include timestamps for crucial moments or sections, if available.
- Summarize in a clear, objective manner without personal opinions or bias.
- Use bullet points or short paragraphs for easy readability.
- Maintain the original tone and style of the video (e.g., formal, casual, educational).

Adjust the summary length based on the video duration:
- For videos < 10 minutes: 100-150 words
- For videos 10-30 minutes: 150-300 words
- For videos 30-60 minutes: 300-500 words
- For videos > 60 minutes: 500-800 words
These are guidelines, not strict rules. Adjust the length as needed to capture all essential information while maintaining conciseness. If the video content is particularly dense or complex, you may need to exceed these ranges slightly.
`;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

dayjs.extend(duration);

const formatMilliseconds = (ms: string) => {
  return dayjs.duration(parseInt(ms)).format('HH:mm:ss');
};

// Helper function to extract video ID from YouTube URL
function extractVideoId(url: string) {
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split(/[?#]/)[0] || null;
  }
  const videoId = url.split('v=')[1]?.split(/[?#&]/)[0];
  return videoId?.length === 11 ? videoId : null;
}

const youtube = new Hono().post('/', async (c) => {
  const { url } = await c.req.json();

  try {
    // Extract video ID from URL
    const videoId = extractVideoId(url);
    if (!videoId) return c.text('Invalid YouTube URL', 400);

    const yt = await Innertube.create({
      lang: 'en',
      location: 'US',
      retrieve_player: false,
    });
    const video = await yt.getInfo(videoId ?? '');
    const transcriptData = await video.getTranscript();

    if (!transcriptData?.transcript?.content?.body?.initial_segments) {
      return c.text('No transcript available for this video', 422);
    }

    const segments = transcriptData.transcript.content.body.initial_segments;

    // text with formatted timestamps
    const fullText = segments
      .map((segment) => `[${formatMilliseconds(segment.start_ms)}] ${segment.snippet.text}`)
      .join(' ');
    // return c.json({ summary: fullText });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: fullText,
        },
      ],
      max_tokens: 1024,
      temperature: 0.5,
    });

    const summary = response.choices[0].message.content;

    return c.json({ summary });
  } catch (err: any) {
    console.error(err);
    return c.text(err || 'Failed to summarize the video', 500);
  }
});

export default youtube;

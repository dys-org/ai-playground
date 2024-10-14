import { Hono } from 'hono';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';

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

const youtube = new Hono().post('/', async (c) => {
  const { url } = await c.req.json();

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    // TODO does this give time stamps?
    const fullText = transcript.map((item) => item.text).join(' ');

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
  } catch (error) {
    console.error('Error:', error);
    return c.json({ error: 'Failed to summarize the lecture' }, 500);
  }
});

export default youtube;

import toast from 'react-hot-toast';

import { Conversation, Message } from '@/types/chat';
import { SavedSetting } from '@/types/settings';
import { SystemPrompt } from '@/types/system-prompt';

import { sendChatRequest } from '../../chat';
import { sendImageRequest } from '../../image';

export async function messageSender(
  builtInSystemPrompts: SystemPrompt[],
  selectedConversation: Conversation,
  messages: Message[],
  savedSettings: SavedSetting[],
  dispatch: React.Dispatch<any>,
): Promise<{ data: null; controller: null; } | { data: ReadableStream<Uint8Array>; controller: AbortController; }> {
  let customPrompt = selectedConversation.systemPrompt;

  if (!selectedConversation.systemPrompt) {
    customPrompt = builtInSystemPrompts.filter(
      (prompt) =>
        prompt.name === `${selectedConversation.model.vendor} Built-In`,
    )[0];
  }

  const promptInjectedConversation = {
    ...selectedConversation,
    systemPrompt: customPrompt,
  };

  const model = selectedConversation.model;
  if (model.type == 'text') {
    const { response, controller } = await sendChatRequest(
      promptInjectedConversation,
      messages,
      savedSettings,
    );

    if (!response.ok) {
      dispatch({ field: 'loading', value: false });
      dispatch({ field: 'messageIsStreaming', value: false });
      toast.error(response.statusText);
      return { data: null, controller: null };
    }
    const data = response.body;
    if (!data) {
      dispatch({ field: 'loading', value: false });
      dispatch({ field: 'messageIsStreaming', value: false });
      return { data: null, controller: null };
    }

    dispatch({ field: 'loading', value: false });
    return { data, controller };
  } else {
    const { response, controller } = await sendImageRequest(
      promptInjectedConversation,
      messages[0].content,
      savedSettings,
    );

    const data = response.body;
    if (!data) {
      dispatch({ field: 'loading', value: false });
      return { data: null, controller: null };
    }

    dispatch({ field: 'loading', value: false });
    return { data, controller };
  }
}

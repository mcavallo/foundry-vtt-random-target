import type { RandomTargetChatMessage } from '#/types/module.ts';
import { MODULE, SETTING_IDS } from '@/constants';
import { $M, isEventTarget } from '@/lib/utils.ts';

export class ChatManager {
  constructor() {
    Hooks.on('renderChatMessageHTML', this._onRenderChatMessage.bind(this));
  }

  _onRenderChatMessage(message: RandomTargetChatMessage, html: HTMLElement) {
    if (!message?.flags?.randomTarget?.type) {
      return;
    }

    if (message.flags.randomTarget.type === 'target') {
      html
        ?.querySelector('[data-action="target-actor"]')
        ?.addEventListener('click', this._targetActorAction.bind(this));
      html
        ?.querySelector('[data-action="toggle-message"]')
        ?.addEventListener('click', this._toggleMessageAction.bind(this));
    }
  }

  _targetActorAction(e: Event) {
    e.stopPropagation();
    if (isEventTarget(e, HTMLElement)) {
      const tokenId = e.target.dataset.targetId;

      if (tokenId) {
        $M().game.targetToken(tokenId);
      }
    }
  }

  _toggleMessageAction(e: Event) {
    e.stopPropagation();
    if (isEventTarget(e, HTMLElement)) {
      e.target
        .closest('[data-action="toggle-message"]')
        ?.classList.toggle('expanded');
    }
  }

  sendTargetNotificationMessage(tokenId: string, candidatesIds: string[]) {
    if (!$M().settings.get(SETTING_IDS.CHAT_NOTIFICATION)) {
      return;
    }

    const target = $M().game.targetToken(tokenId);

    if (!target) {
      return;
    }

    const candidatesPool = candidatesIds
      .map(tokenId => {
        const candidate = $M().game.getToken(tokenId);
        const isSelected = candidate && candidate.id === target.id;
        const name = candidate ? candidate.name : `Unknown token (${tokenId})`;
        return `<li><span${isSelected ? ' class="target"' : ''}>${name}</span></li>`;
      })
      .join('');

    const targetTooltip = 'Target: ' + target.name.replace(/"/g, '&quot;');
    const recipients = $M().settings.get(SETTING_IDS.CHAT_NOTIFICATION_PUBLIC)
      ? null
      : ChatMessage.getWhisperRecipients('GM').map(recipient => recipient.id);

    void ChatMessage.create({
      speaker: { alias: MODULE.NAME },
      whisper: recipients,
      flags: {
        // @ts-expect-error types need fixing here
        randomTarget: {
          type: 'target',
        },
      },
      content: `
        <div class="${MODULE.ID}-message">
          <div class="target-result" data-action="toggle-message">          
            <p>
              <a
                class="content-link ${MODULE.ID}-message-target"
                data-action="target-actor"
                data-target-id="${target.id}"
                data-tooltip="${targetTooltip}"
              ><i class="fas fa-bullseye"></i>${target.name}</a> was randomly selected.
            </p>
            <div class="target-details">
              <div>
                <section>
                  The pool of candidates for this selection:
                  <ul>${candidatesPool}</ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      `,
    });
  }
}

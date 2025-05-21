import { MODULE, SETTING_IDS } from '../constants.js';
import { $M } from '../utils.js';

export class ChatManager {
  #renderHandler;

  constructor() {
    this.#renderHandler = this._onRenderChatMessage.bind(this);
    Hooks.on('renderChatMessage', this.#renderHandler);
  }

  _onRenderChatMessage(message, html) {
    if (!message?.flags?.[MODULE.NAMESPACE]?.type) {
      return;
    }

    if (message.flags[MODULE.NAMESPACE].type === 'target') {
      html.find('[data-action="target-actor"]').click(this._targetActorAction);
      html.find('[data-action="toggle-message"]').click(this._toggleMessageAction);
    }
  }

  _targetActorAction(e) {
    e.stopPropagation();
    const tokenId = $(e.target)[0].dataset.targetId;

    if (tokenId) {
      $M().game.targetToken(tokenId);
    }
  }

  _toggleMessageAction(e) {
    e.stopPropagation();
    $(e.target).closest('[data-action="toggle-message"]').toggleClass('expanded');
  }

  sendTargetNotificationMessage(tokenId, candidatesIds) {
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

    ChatMessage.create({
      speaker: { alias: MODULE.NAME },
      whisper: recipients,
      flags: {
        [MODULE.NAMESPACE]: {
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

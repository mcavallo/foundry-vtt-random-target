import { MODULE, SETTING_IDS } from '../constants.js';
import { $M } from '../utils.js';

export class ChatManager {
  #renderHandler;

  constructor() {
    this.#renderHandler = this._onRenderChatLog.bind(this);
    Hooks.on('renderChatLog', this.#renderHandler);
  }

  _onRenderChatLog(_app, html) {
    $(html).on('click', `.${MODULE.ID}-message-target`, e => {
      e.stopPropagation();
      const tokenId = $(e.target)[0].dataset.targetId;

      if (!tokenId) {
        return;
      }

      $M().game.targetToken(tokenId);
    });
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
      content: `
        <div class="${MODULE.ID}-message">
          <div class="dice-roll">
              <div class="dice-result">
                <div>
                  <a
                    class="content-link ${MODULE.ID}-message-target"
                    data-target-id="${target.id}"
                    data-tooltip="${targetTooltip}"
                  ><i class="fas fa-bullseye"></i>${target.name}</a> was randomly selected.
                </div>
                <div class="dice-tooltip">
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

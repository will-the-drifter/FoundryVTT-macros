if (game.user.targets.size !== 1) {
  ui.notifications.warn("Target exactly one token.");
  return;
}
let target = game.user.targets.values().next().value;

let content = `
  <p>Apply Spiritual Shield effect.</p>
  <div class="form-group">
    <label>Cast at level:</label>
    <select id="spell-level">
      ${[2, 3, 4, 5, 6, 7, 8, 9].map(l => `<option value="${l}">${l}</option>`).join('')}
    </select>
  </div>
`;

new Dialog({
  title: "Spiritual Shield",
  content: content,
  buttons: {
    next: {
      label: "Next",
      callback: html => applyEffect(parseInt(html.find('#spell-level').val()))
    }
  }
}).render(true);

function applyEffect(lvl) {
  let aB = lvl >= 8 ? 5 : lvl >= 6 ? 4 : lvl >= 4 ? 3 : 2;
  let rB = lvl >= 8 ? 3 : lvl >= 6 ? 2 : lvl >= 4 ? 1 : 0;

  let effects = {
    ac: {
      label: `Shield - AC +${aB}`,
      icon: "icons/equipment/shield/heater-crystal-blue.webp",
      changes: [{ key: "system.attributes.ac.value", mode: 2, value: `+${aB}`, priority: 20 }],
      duration: { seconds: 60 }
    },
    resistance: {
      label: `Shield - AC +${rB} and Resistance`,
      icon: "icons/equipment/shield/heater-crystal-blue.webp",
      changes: [
        { key: "system.attributes.ac.value", mode: 2, value: `+${rB}`, priority: 20 },
        { key: "system.traits.dr.value", mode: 2, value: "", priority: 20 }
      ],
      duration: { seconds: 60 }
    }
  };

  let effectDialog = new Dialog({
    title: "Choose Effect",
    content: `
      <p>Select effect:</p>
      <div style="display: flex; justify-content: space-around;">
        <button id="ac">AC Boost</button>
        <button id="res">Resistance</button>
      </div>
      <div id="res-options" style="display: none;">
        <p>Select resistance type:</p>
        <select id="res-type">
          <option value="necrotic">Necrotic</option>
          <option value="poison">Poison</option>
          <option value="psychic">Psychic</option>
        </select>
        <button id="apply-res">Apply</button>
      </div>
    `,
    buttons: {},
    render: html => {
      html.find('#ac').click(async () => {
        await target.actor.createEmbeddedDocuments("ActiveEffect", [effects.ac]);
        ChatMessage.create({ content: `Applied Shield - AC +${aB} to ${target.name}`, whisper: ChatMessage.getWhisperRecipients("Morten") });
        effectDialog.close(); // Correctly closes just the dialog
      });
      html.find('#res').click(() => {
        html.find('#res-options').show();
        html.find('#ac').prop('disabled', true);
      });
      html.find('#apply-res').click(async () => {
        let resType = html.find('#res-type').val();
        effects.resistance.changes[1].value = resType;
        await target.actor.createEmbeddedDocuments("ActiveEffect", [effects.resistance]);
        ChatMessage.create({ content: `Applied Shield - AC +${rB} and ${resType} resistance to ${target.name}`, whisper: ChatMessage.getWhisperRecipients("Morten") });
        effectDialog.close(); // Correctly closes just the dialog
      });
    }
  }).render(true);
}
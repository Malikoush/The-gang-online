import { useRoom } from '../state/RoomProvider';

/** Résumé en lecture seule des réglages de partie, identique pour l'hôte et les autres joueurs
 *  (l'hôte les modifie via la modale ouverte depuis la roue crantée). */
export function RoomSettingsPanel() {
  const { state } = useRoom();
  if (!state) return null;
  const { chatEnabled, responseTimeSeconds } = state.settings;

  return (
    <p className="settings-summary">
      Chat pendant les manches : {chatEnabled ? 'activé' : 'désactivé'} · Temps de réponse :{' '}
      {responseTimeSeconds === null ? 'illimité' : `${responseTimeSeconds}s`}
    </p>
  );
}

import { useEffect, useState } from 'react';
import { useRoom } from '../state/RoomProvider';

// On n'affiche le message qu'après un court délai : la plupart des coupures se
// résolvent en une seconde ou deux (pas la peine d'inquiéter pour rien), mais sur
// l'hébergement gratuit le service peut s'être endormi et prendre jusqu'à une minute
// à se réveiller — ce message évite de faire croire que l'appli est cassée.
const WAKE_DELAY_MS = 2500;

export function ConnectionBanner() {
  const { connected } = useRoom();
  const [showWaking, setShowWaking] = useState(false);

  useEffect(() => {
    if (connected) {
      setShowWaking(false);
      return;
    }
    const id = setTimeout(() => setShowWaking(true), WAKE_DELAY_MS);
    return () => clearTimeout(id);
  }, [connected]);

  if (!showWaking) return null;

  return (
    <div className="connection-banner">
      Connexion au serveur… ça peut prendre jusqu'à une minute s'il était en veille.
    </div>
  );
}

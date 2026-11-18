# Petit exemple : un mini-relais HLS

`mini-relais.js` montre **le principe de base** de Stream Relay en une soixantaine de lignes : une adresse fixe
(`/live.m3u8`) qui relaie une chaîne en direct, sans convertir la vidéo.

1. Il télécharge la playlist HLS de la source.
2. Il réécrit les adresses des morceaux de vidéo pour qu'ils passent par lui.
3. Il transmet ces morceaux tels quels au lecteur.

```bash
SOURCE="https://exemple.net/direct/index.m3u8" node mini-relais.js
```

Sous Windows (CMD), en deux commandes :

```bash
set SOURCE=https://exemple.net/direct/index.m3u8
```

```bash
node mini-relais.js
```

Puis ouvre `http://localhost:8080/live.m3u8` dans VLC (Média → Ouvrir un flux réseau).

Il faut Node.js 18 ou plus récent, sans rien installer d'autre.

**Ce n'est pas Stream Relay.** Tout ce qui fait son intérêt n'est pas ici : retrouver le lien tout seul sur la
page d'un site, le vérifier, le renouveler avant qu'il expire, les en-têtes et cookies du site, plusieurs
chaînes et sources, le préchargement, les écrans de panne, les alertes, Jellyfin, la sécurité… Voir
[Comment ça marche](../FONCTIONNEMENT.md).

Ce code est couvert par la [licence du dépôt](../LICENSE) : tous droits réservés.

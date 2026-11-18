// Mini-relais : le principe de Stream Relay en une soixantaine de lignes.
//
// Un lecteur (VLC, Jellyfin, un navigateur avec hls.js…) lit toujours la même adresse fixe :
//   http://localhost:8080/live.m3u8
// Le mini-relais va chercher la playlist HLS de la source, réécrit les adresses des morceaux de vidéo
// pour qu'ils passent aussi par lui, puis transmet la vidéo telle quelle (aucune conversion).
//
// Lancer (Node.js 18 ou plus récent, aucune dépendance) :
//   SOURCE="https://exemple.net/direct/index.m3u8" node mini-relais.js
//
// Ce que le vrai Stream Relay fait en plus, et qui n'est pas ici : retrouver le lien tout seul sur la page
// d'un site (navigateur invisible et clics appris), le vérifier, le renouveler avant qu'il expire, garder
// les en-têtes et cookies du site, gérer plusieurs chaînes et plusieurs sources, le cache, les écrans
// « chaîne indisponible », les alertes, Jellyfin, la sécurité… Ce fichier n'est qu'une démonstration.

import http from 'node:http';
import { Readable } from 'node:stream';

const SOURCE = process.env.SOURCE;
const PORT = Number(process.env.PORT) || 8080;
if (!SOURCE) {
  console.error('Indique la playlist à relayer : SOURCE="https://…/index.m3u8" node mini-relais.js');
  process.exit(1);
}

// Chaque adresse de la playlist (morceau de vidéo, sous-playlist, clé) devient /relais?u=<adresse complète>.
function reecrire(texte, base) {
  const via = (uri) => '/relais?u=' + encodeURIComponent(new URL(uri, base).href);
  return texte
    .split(/\r?\n/)
    .map((ligne) => {
      const l = ligne.trim();
      if (!l) return ligne;
      if (l.startsWith('#')) return ligne.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${via(uri)}"`);
      return via(l);
    })
    .join('\n');
}

async function servir(res, adresse) {
  const amont = await fetch(adresse);
  if (!amont.ok) return res.writeHead(502).end(`La source répond HTTP ${amont.status}`);
  const type = amont.headers.get('content-type') || '';
  // Une playlist est réécrite ; un morceau de vidéo est transmis tel quel, au fil de l'eau.
  if (/mpegurl/i.test(type) || new URL(adresse).pathname.endsWith('.m3u8')) {
    const texte = reecrire(await amont.text(), adresse);
    return res.writeHead(200, { 'content-type': 'application/vnd.apple.mpegurl', 'cache-control': 'no-cache' }).end(texte);
  }
  res.writeHead(200, { 'content-type': type || 'video/mp2t' });
  Readable.fromWeb(amont.body).pipe(res);
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname === '/live.m3u8') return await servir(res, SOURCE);
      if (url.pathname === '/relais' && url.searchParams.get('u')) return await servir(res, url.searchParams.get('u'));
      res.writeHead(404).end('Adresse inconnue : lis /live.m3u8');
    } catch (err) {
      if (!res.headersSent) res.writeHead(502).end(`Source injoignable : ${err.message}`);
      else res.destroy();
    }
  })
  .listen(PORT, () => console.log(`Mini-relais prêt : http://localhost:${PORT}/live.m3u8 (source : ${SOURCE})`));

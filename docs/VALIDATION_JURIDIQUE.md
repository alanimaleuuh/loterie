# Validation juridique préalable — obligatoire avant toute activation de paiements réels

Ce prototype **ne prétend à aucune conformité juridique**. Les textes des pages « Mentions légales », « CGU », « Confidentialité » et « Règlement » sont des **modèles à compléter**, rédigés sans aucune validation.

Selon les pays, une opération de vente de tickets donnant une chance de gagner un lot par tirage au sort peut être qualifiée de **loterie** ou de **jeu d'argent et de hasard**, et donc être **interdite** ou soumise à agrément ou licence. En France par exemple, les loteries sont interdites par principe, sous réserve d'exceptions strictement encadrées. Seul un professionnel du droit peut qualifier le modèle envisagé.

## Points à faire valider par un avocat, pour chaque pays ciblé

1. **Qualification juridique** de l'opération (loterie, jeu-concours, jeu d'argent, vente avec prime…) et régime applicable (interdiction, autorisation, licence, autorité compétente).
2. **Droit applicable** et ciblage géographique (blocage des pays non autorisés).
3. **Conditions de participation** : âge minimum, vérification d'identité, exclusions (salariés, proches), éventuelle participation gratuite obligatoire, limites de participation.
4. **Règles de tirage** : méthode d'aléa acceptable, intervention d'un commissaire de justice, dépôt du règlement, conservation des preuves, publication des résultats.
5. **Publicité et communication** : mentions obligatoires, présentation des chances de gain, interdictions de ciblage, influenceurs.
6. **Protection des mineurs** : vérification de l'âge, design non incitatif pour les mineurs.
7. **Jeu responsable** : limites de dépense, auto-exclusion, messages de prévention, le cas échéant.
8. **Protection des données (RGPD)** : registre des traitements, bases légales, durées de conservation, sous-traitants, AIPD éventuelle, exercice des droits, cookies.
9. **Fiscalité** : TVA sur les tickets, prélèvements spécifiques éventuels, fiscalité des lots pour l'organisateur et le gagnant.
10. **Obligations liées aux paiements** : acceptation du secteur par le prestataire de paiement (souvent restreint pour les jeux), lutte contre le blanchiment (KYC), PCI-DSS.
11. **Conditions générales** de vente et d'utilisation, médiation de la consommation.
12. **Politique de remboursement** : annulation, minimum non atteint, droit de rétractation et ses exceptions éventuelles, lot indisponible.
13. **Remise des lots** : délais, livraison, garantie, lot non réclamé, substitution.

## État du prototype

- `DEMO_MODE=true` par défaut, avec une bannière « Démo » sur toutes les pages.
- `PAYMENT_PROVIDER=mock` imposé par un garde-fou dans le code ; seules les cartes de test sont acceptées.
- Aucun lot réel n'est attribué.

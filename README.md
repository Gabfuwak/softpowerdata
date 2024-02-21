# PROJET WEB SEMANTIQUE
_Le code du projet est assez mal abouti, mais je trouve le concept super donc le repo restera public pour l'instant_

## Soft power: A quel point la popularité d'un film aide au rayonnement international d'un pays?

On a tous déjà entendu parler de soft power
-C'est quoi le soft power

### Comment quantifier le softpower?

Plein de façons de faire, j'ai pas trop le temps de les detailler en 5min ici, je vous invite a lire ce court papier de 3 pages tres interessant pour plus de details.

Echelle "d'importance"
 - Acheter un ticket pour voir un film au cinema
 - Visiter le pays pour des vacances
 - Faire ses etudes dans le pays
 - Demenager sur du long/tres logn terme pour le pays

J'ai choisi les USA pour 2 raison:
 - C'est un cas d'ecole du soft power, ils ont pratiquement inventé le concept
 - Les données sont disponibles assez facilement

J'ai choisi d'etudier donc, l'impact des films amerinains sur


## La structure de mon graphe de conaissances

3 classes:
- Country, qui represente un pays
 - Data properties:
  - un nom
  - un nombre d'etudiants
 - Object propeties
  - hasMovie (Tous les films sortis dans ce pays, inverse of hasCountry)
  - hasStudents (les etudiants originaires de ce pays chaque années, inverse of hasOrigin)

- Movie, qui represente un film sorti dans un pays
 - Data properties
  - un box office
  - un nom
 - Object Properties
  - hasCountry (pays dans lequel le film a été tourné, inverse of hasMovie)

- Students, (assez mal nommé mais pas trouvé mieux) qui represente un nombre d'etudiants pour une année donnée
 - Data properties
  - year
  - number (le nombre d'etudiants)
 - Object properties
  - hasOrigin (son pays d'origine, inverse of hasStudents)
 
## Recuperation de données

### Recuperation de données pour les etudiants:

#### Recuperer les données initiales

J'ai récuperé les données "international students" sur https://opendoorsdata.org, un site que j'ai trouvé grace au NTTO ( National Travel and Tourism Office), un departement du US Department of commerce.

Le site donne un fichier excel, que j'ai nettoyé a la main, pour au final obtenir mon CSV intermediaire.

J'ai ensuite donné le CSV a un script python pour que son format soit plus simple a integrer dans mon graphe de données.

### Pipeline recuperation de données des films:

#### On fais une requete a wikidata de tous les films americains (environ 27000)
```sparql
SELECT DISTINCT ?movie ?movieLabel ?release_date
WHERE {
  ?movie wdt:P31 wd:Q11424;  # is a film
        wdt:P495 wd:Q30;     # country USA
        wdt:P577 ?release_date.  # has release date

  FILTER((?release_date >= "1999-01-01"^^xsd:dateTime) && (?release_date <= "2019-12-31"^^xsd:dateTime))
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?release_date)
```

#### On enleve les doublons (environ 19000 restants)
->note: si deux films ont le meme nom et sont sortis a une date differente, je le considere comme doublon et le supprime de ma liste. C'est potentiellement un probleme si par exemple un film tres impactant est ressorti a deux periodes differentes. C'est une des limitations de ma methode.

#### On la donne a un script python qui va, pour chaque film, recuperer son box office en fonction du pays sur box office mojo et les mettre dans un CSV
->note: il manque de la data, ce n'est pas trop grave car les films impactants culturellements sont aussi souvent les plus connus, et la data ne manque pas sur le film.
->paralelisation

#### On recupere le CSV dans ontorefine et on transforme en triplets.


## Affichage des données

On affiche les données grace a un line chart de chartJS.

On a 3 graphes, 2 de données, un d'analyse.

- Les deux graphes de données 
 - Le nombre d'étudiants aux USA originaire du pays etudié (année par année)
 - le revenu total de tous les films americains dans le pays etudié (année par année)

Le graphe d'analyse est en fait une seule valeur. C'est une quantité de 0 a 1. 1 veut dire que les deux courbes sont exactement les memes, 0 veut dire qu'elles sont exactement inverses.

Ici on essaie de montrer que les courbes ont une tres grosses correlation et donc une valeur proche de 1.


## Conclusion

Pas vraiment de correlation, le box office monte dans tous les pays, et au final, si il y a une forte correlation au global, c'est juste parce que les deux valeurs augmentent de facon paralleles sans forcement qu'une cause l'autre.

Des cas comme le Japon ou l'Argentine ont une tres forte correlation inverse, de moins en moins d'etudiants aux USA de plus en plus de box office pour les films des USA.

On pourrait avoir plusieurs perspectives d'ameliorations. Les données des visas vacances pouraient etre plus representatifs du soft power par exemple. on pourrait aussi essayer de trouver des donées plus anciennes, malheureusement elles ne sont pas precises avant 1999 pour les USA.

On pourrait aussi etendre a d'autres medias que les films, la musique par exemple (bien que plus difficilement quantifiable, streams, albums vendus, les données sont differentes selon les epoques)


## Sources/extension du sujet:

https://sites.nationalacademies.org/cs/groups/dbassesite/documents/webpage/dbasse_179613.pdf

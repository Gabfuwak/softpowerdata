# PROJET WEB SEMANTIQUE
_Le code du projet est assez mal abouti, mais je trouve le concept super donc le repo restera public pour l'instant.
Le readme est plus une description globale du projet et du cheminement pour arriver a la fin (ce que j'ai dit a l'oral de soutenance) qu'un readme classique.

## Soft power: A quel point la popularité d'un film aide au rayonnement international d'un pays?

Le soft power est l'influence culturelle appliquée a l'international par un pays. Il a des impacts sur l'économie, la culture des autres pays, les alliances politiques, militaires etc..

### Comment quantifier le softpower?

Beaucoup de méthodes permettent de quantifier le soft power, je vous invite a lire ce court papier de 3 pages très intéressant sur lequel ce projet s'est basé pour plus de détails.
<https://sites.nationalacademies.org/cs/groups/dbassesite/documents/webpage/dbasse_179613.pdf>

En résumé, on considère différentes action qu'un habitant d'un pays peut faire avec une certaine échelle d'importance: 
 1. Acheter un ticket pour voir un film au cinéma
 2. Visiter le pays pour des vacances
 3. Faire ses études dans le pays
 4. Déménager sur du long/tres long terme dans le pays

J'ai choisi les USA pour 2 raison:
 - C'est un cas d'ecole du soft power, ils ont pratiquement inventé le concept
 - Les données sont disponibles assez facilement

J'ai choisi d'étudier donc, l'impact des films américains sur le nombre d'étudiants étranger qui viennent y faire leurs études.


## La structure de mon graphe de connaissances

3 classes:
- Country, qui represente un pays
 - Data properties:
  - un nom
  - un nombre d'etudiants
 - Object propeties
  - hasMovie (Tous les films sortis dans ce pays, inverse of hasCountry)
  - hasStudents (les etudiants originaires de ce pays chaque années, inverse of hasOrigin)

- Movie, qui représente un film sorti dans un pays
 - Data properties
  - un box office
  - un nom
 - Object Properties
  - hasCountry (pays dans lequel le film a été tourné, inverse of hasMovie)

- Students, (assez mal nommé mais pas trouvé mieux) qui représente un nombre d'etudiants pour une année donnée
 - Data properties
  - year
  - number (le nombre d'etudiants)
 - Object properties
  - hasOrigin (son pays d'origine, inverse of hasStudents)
 
## Récupération de données

### Récupération de données pour les étudiants:

#### Récupérer les données initiales

J'ai récupéré les données "international students" sur https://opendoorsdata.org, un site que j'ai trouvé grâce au NTTO ( National Travel and Tourism Office), un département du US Department of commerce.

Le site donne un fichier excel, que j'ai nettoyé a la main, pour au final obtenir mon CSV intermédiaire.

J'ai ensuite donné le CSV a un script python pour que son format soit plus simple a intégrer dans mon graphe de données. J'ai utilisé l'outil _Ontotext refine_ pour insérer les données. 

### Pipeline récupération de données des films:

#### On fais une requête a Wikidata de tous les films américains (environ 27000)
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

1.  **On enlève les doublons (environ 19000 restants)**
_Note: si deux films ont le même nom et sont sortis a une date différente, je le considère comme doublon et le supprime de ma liste. C'est potentiellement un problème si par exemple un film très impactant est ressorti a deux périodes différentes. C'est une des limitations de ma méthode._

2. **On la donne a un script python qui va, pour chaque film, récupérer son box office en fonction du pays sur <boxofficemojo.com> et les mettre dans un CSV**
_Note: il manque des données. Ce n'est pas trop grave car les films impactant culturellement sont aussi souvent les plus connus, et sera donc répertorié sur le site._


3. **On recupere le CSV dans Ontotext refine et on transforme en triplets.**


## Affichage des données

On affiche les données grâce a un line chart de chartJS.

On a 3 graphes, 2 de données, un d'analyse.

- Les deux graphes de données 
 - Le nombre d'étudiants aux USA originaire du pays étudié (année par année)
 - le revenu total de tous les films américains dans le pays étudié (année par année)

Le graphe d'analyse est en fait une seule valeur. C'est une quantité de 0 a 1. 1 veut dire que les deux courbes sont exactement les mêmes, 0 veut dire qu'elles sont exactement inverses.

Ici on essaie de montrer que les courbes ont une très grosses corrélation et donc une valeur proche de 1.


## Conclusion

Il y a une forte corrélation, mais pas forcement de causalité. En effet, le box office monte dans tous les pays, et au final, les deux valeurs augmentent de façon parallèles sans forcement qu'une cause l'autre.

On peut expliquer ça par l'augmentation du niveau de vie dans beaucoup de pays, qui contribue a alimenter le marché du cinéma, dont américain.

Des cas comme le Japon ou l'Argentine ont une très forte corrélation inverse, de moins en moins d'étudiants aux USA de plus en plus de box office pour les films des USA.

On pourrait avoir plusieurs perspectives d'améliorations. Les données des visas vacances pourraient être plus représentatifs du soft power par exemple. on pourrait aussi essayer de trouver des données plus anciennes, malheureusement elles ne sont pas précises avant 1999 pour les USA.

Une autre possibilité serait de voir les parts de marché des différents films. Si la proportion de films américains augmente dans la totalité des films consommés dans un pays, cela pourrait gommer l'effet de l'augmentation globale du marché du cinéma dans les pays dont le niveau de vie augmente

On pourrait aussi étendre a d'autres médias que les films, la musique par exemple (bien que plus difficilement quantifiable, streams, albums vendus, les données sont différentes selon les époques)

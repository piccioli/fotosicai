# Fixture fotografiche per i test

Foto JPEG reali usate dai test automatici come esempi rappresentativi.
I file sono committati nel repository e possono essere usati come riferimento.

## File inclusi

### `foto-con-gps.jpeg`

Foto con coordinate GPS nei metadati EXIF (scattata da iPhone sul Sentiero Italia).
Usata come fixture principale per il flusso completo di upload e per verificare
l'estrazione automatica della posizione dall'EXIF.

### `foto-senza-gps.jpeg`

Foto senza coordinate GPS nei metadati EXIF.
Usata per verificare il flusso con posizione inserita manualmente nel body della richiesta.

## Aggiungere altre fixture

Per aggiungere foto aggiuntive basta copiarle in questa directory.
I test cercano i file in questo ordine di priorità (`.jpg` e `.jpeg` sono entrambi supportati):

```
foto-test.jpg / foto-test.jpeg        # priorità massima come fixture generica
foto-con-gps.jpg / foto-con-gps.jpeg  # usata anche per il test GPS EXIF
foto-senza-gps.jpg / foto-senza-gps.jpeg
```

## Effetto sui test

- I test di upload usano automaticamente la prima fixture trovata nell'ordine sopra.
- Se una fixture non è presente il test relativo viene saltato con avviso in console.
- I test di validazione, listing vuoto e admin non richiedono fixture.

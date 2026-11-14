package ma.commune.files.domain;

/** Valeur stockée dans file_attente.politique. Le pattern Strategy reconstruit la PolitiqueFile à partir de ce code. */
public enum CodePolitique {
    FIFO, PRIORITE, CHARGE_EQUILIBREE
}

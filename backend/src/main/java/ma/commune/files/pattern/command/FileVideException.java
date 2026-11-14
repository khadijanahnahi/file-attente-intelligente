package ma.commune.files.pattern.command;

/** Aucun ticket en attente : le système informe l'agent (CU2, scénario alternatif). */
public class FileVideException extends RuntimeException {
    public FileVideException() {
        super("Aucun ticket en attente dans cette file");
    }
}

package ma.commune.files.exception;

/** CU1 alternatif : la file a atteint sa capacité maximale. */
public class FileSatureeException extends RuntimeException {
    public FileSatureeException(String message) { super(message); }
}

package ma.commune.files.exception;

/** CU1 alternatif : service fermé ou inactif. Le message propose un autre horaire. */
public class ServiceFermeException extends RuntimeException {
    public ServiceFermeException(String message) { super(message); }
}

package ma.commune.files.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EstimationServiceTest {

    @Test
    void formuleDuCahierDesCharges() {
        assertEquals(0, EstimationService.calculer(0, 8, 2));
        assertEquals(8, EstimationService.calculer(1, 8, 1));
        assertEquals(20, EstimationService.calculer(5, 8, 2));    // 5 x 8 / 2
        assertEquals(14, EstimationService.calculer(3, 4.5, 1));  // 13,5 arrondi au-dessus
    }

    @Test
    void sansGuichetOuvertOnSupposeUnGuichet() {
        assertEquals(16, EstimationService.calculer(2, 8, 0));
    }
}

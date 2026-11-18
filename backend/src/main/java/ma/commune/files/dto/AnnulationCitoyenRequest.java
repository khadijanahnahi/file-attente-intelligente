package ma.commune.files.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnnulationCitoyenRequest(@NotBlank @Size(max = 150) String contact) {}

package ma.commune.files.dto;

import jakarta.validation.constraints.NotNull;
import ma.commune.files.domain.CodePolitique;

public record PolitiqueRequest(@NotNull CodePolitique politique) {
}

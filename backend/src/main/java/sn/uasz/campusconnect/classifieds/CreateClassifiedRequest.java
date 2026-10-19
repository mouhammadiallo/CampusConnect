package sn.uasz.campusconnect.classifieds;

import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateClassifiedRequest(
        @NotBlank @Size(min = 4, max = 120) String title,
        @NotBlank @Size(min = 10, max = 3000) String description,
        @NotNull ClassifiedCategory category,
        @DecimalMin("0.0") @Digits(integer = 10, fraction = 2) BigDecimal price,
        @Size(max = 120) String location) {}

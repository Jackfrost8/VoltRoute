package com.voltroute.modules.station.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standardized charging connector / plug specification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Charging connector / plug specification")
public class ConnectorDto {

    @Schema(description = "Connector identifier", example = "234940")
    private Long id;

    @Schema(description = "Open Charge Map connector type ID", example = "30")
    private Integer connectionTypeId;

    @Schema(description = "Connector standard name", example = "CCS (Type 2)")
    private String connectionTypeName;

    @Schema(description = "Formal industry standard name", example = "IEC 62196-3 Configuration FF")
    private String formalName;

    @Schema(description = "Maximum output power in kilowatts (kW)", example = "150.0")
    private Double powerKw;

    @Schema(description = "Voltage rating in volts (V)", example = "400")
    private Integer voltage;

    @Schema(description = "Current rating in amperes (A)", example = "350")
    private Integer amps;

    @Schema(description = "Current type (AC Single-Phase, AC Three-Phase, or DC)", example = "DC")
    private String currentType;

    @Schema(description = "Quantity of plugs of this specific type", example = "4")
    private Integer quantity;

    @Schema(description = "Operational status of the connector", example = "Operational")
    private String status;

    @Schema(description = "Whether connector is fast-charge capable (DC or Level 3)", example = "true")
    private boolean isFastChargeCapable;
}

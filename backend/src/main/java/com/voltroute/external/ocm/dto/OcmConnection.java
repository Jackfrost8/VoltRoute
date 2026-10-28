package com.voltroute.external.ocm.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OcmConnection {

    @JsonProperty("ID")
    private Long id;

    @JsonProperty("ConnectionTypeID")
    private Integer connectionTypeId;

    @JsonProperty("ConnectionType")
    private OcmConnectionType connectionType;

    @JsonProperty("StatusTypeID")
    private Integer statusTypeId;

    @JsonProperty("StatusType")
    private OcmStatusType statusType;

    @JsonProperty("LevelID")
    private Integer levelId;

    @JsonProperty("Level")
    private OcmLevel level;

    @JsonProperty("Amps")
    private Integer amps;

    @JsonProperty("Voltage")
    private Integer voltage;

    @JsonProperty("PowerKW")
    private Double powerKw;

    @JsonProperty("CurrentTypeID")
    private Integer currentTypeId;

    @JsonProperty("CurrentType")
    private OcmCurrentType currentType;

    @JsonProperty("Quantity")
    private Integer quantity;

    @JsonProperty("Comments")
    private String comments;
}

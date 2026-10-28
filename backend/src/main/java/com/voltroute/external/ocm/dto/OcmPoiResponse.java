package com.voltroute.external.ocm.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Raw Open Charge Map Point of Interest (POI) JSON representation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OcmPoiResponse {

    @JsonProperty("ID")
    private Long id;

    @JsonProperty("UUID")
    private String uuid;

    @JsonProperty("DataProviderID")
    private Integer dataProviderId;

    @JsonProperty("OperatorID")
    private Integer operatorId;

    @JsonProperty("OperatorsReference")
    private String operatorsReference;

    @JsonProperty("UsageTypeID")
    private Integer usageTypeId;

    @JsonProperty("AddressInfo")
    private OcmAddressInfo addressInfo;

    @JsonProperty("Connections")
    private List<OcmConnection> connections;

    @JsonProperty("NumberOfPoints")
    private Integer numberOfPoints;

    @JsonProperty("GeneralComments")
    private String generalComments;

    @JsonProperty("DateLastStatusUpdate")
    private String dateLastStatusUpdate;

    @JsonProperty("StatusTypeID")
    private Integer statusTypeId;

    @JsonProperty("StatusType")
    private OcmStatusType statusType;

    @JsonProperty("OperatorInfo")
    private OcmOperatorInfo operatorInfo;
}

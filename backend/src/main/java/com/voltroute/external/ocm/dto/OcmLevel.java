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
public class OcmLevel {

    @JsonProperty("ID")
    private Integer id;

    @JsonProperty("Title")
    private String title;

    @JsonProperty("Comments")
    private String comments;

    @JsonProperty("IsFastChargeCapable")
    private Boolean isFastChargeCapable;
}

package com.example.crm.activity.mapper;

import com.example.crm.activity.dto.ActivityResponse;
import com.example.crm.activity.entity.Activity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ActivityMapper {

    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(target = "performedBy", expression = "java(mapPerformedBy(activity.getPerformedBy()))")
    ActivityResponse toResponse(Activity activity);

    default ActivityResponse.PerformedByDto mapPerformedBy(com.example.crm.user.entity.User user) {
        if (user == null) {
            return null;
        }
        ActivityResponse.PerformedByDto dto = new ActivityResponse.PerformedByDto();
        dto.setId(user.getId());
        dto.setName(user.getFirstName() + " " + user.getLastName());
        return dto;
    }
}

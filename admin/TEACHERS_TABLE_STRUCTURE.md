# Teachers Table Structure

## Overview
The Teachers page now supports **9 fields** for comprehensive teacher information management.

## Fields Structure

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 1 | **First Name** | Text | ✅ Yes | Teacher's first name |
| 2 | **Middle Name** | Text |  No | Teacher's middle name (optional) |
| 3 | **Last Name** | Text | ✅ Yes | Teacher's last name |
| 4 | **Telephone Number** | Phone | ❌ No | Contact phone number |
| 5 | **Gender** | Select | ✅ Yes | Male / Female / Other |
| 6 | **Role** | Select | ✅ Yes | Teacher's role in the institution |
| 7 | **Title** | Select | ✅ Yes | Mr. / Ms. / Mrs. / Dr. / Prof. |
| 8 | **Email** | Email | ✅ Yes | Email address |
| 9 | **Date of Birth** | Date | ❌ No | Date of birth (YYYY-MM-DD) |

## Role Options

- Teacher
- Senior Teacher
- Head of Department
- Vice Principal
- Principal
- Teaching Assistant

## Title Options

- Mr.
- Ms.
- Mrs.
- Dr.
- Prof.

## Gender Options

- Male
- Female
- Other

## Display Format

Teacher cards display the following information:

**Header:**
- Avatar (initials)
- Full Name: `{Title} {First Name} {Middle Name} {Last Name}`
- Role

**Details:**
- ️ Email address
- 📞 Telephone number
- 🎫 Gender | Role
- 📅 Date of Birth (if provided)
- Status badge (Active/Inactive)

## Excel/CSV Upload Format

When uploading Excel files, ensure your columns match these names (case-insensitive):

```
First Name | Middle Name | Last Name | Telephone Number | Gender | Role | Title | Email | Date of Birth
```

### Supported Column Name Variations:

**First Name:**
- First Name
- FirstName
- First_Name
- FName

**Middle Name:**
- Middle Name
- MiddleName
- Middle_Name
- MName

**Last Name:**
- Last Name
- LastName
- Last_Name
- LName
- Surname

**Telephone:**
- Telephone Number
- TelephoneNumber
- Phone
- Phone Number
- Contact Number

**Gender:**
- Gender
- Sex

**Role:**
- Role
- Position
- Job Title
- JobTitle

**Title:**
- Title
- Salutation
- Prefix

**Email:**
- Email
- Email Address
- EmailAddress
- E-mail

**Date of Birth:**
- Date of Birth
- DateOfBirth
- DOB
- Birth Date
- BirthDate

## Example Data

```json
{
  "id": 1,
  "firstName": "Sarah",
  "middleName": "Marie",
  "lastName": "Johnson",
  "telephone": "+1 234-567-8901",
  "gender": "Female",
  "role": "Teacher",
  "title": "Ms.",
  "email": "sarah.johnson@school.edu",
  "dateOfBirth": "1985-03-15",
  "status": "active"
}
```

## Display Example

**Card Header:**
```
[SM] Ms. Sarah Marie Johnson
     Teacher
```

**Card Details:**
```
️ sarah.johnson@school.edu
📞 +1 234-567-8901
🎫 Female | Teacher
📅 DOB: 1985-03-15
● Active
```

## Features

✅ **Search**: Search by full name (including title and middle name) or email  
✅ **Filter by Role**: Filter teachers by their role  
✅ **Filter by Status**: Filter by Active/Inactive status  
✅ **Bulk Upload**: Import from Excel/CSV files  
✅ **Add Teacher**: Modal form with all 9 fields  
✅ **Card View**: Visual display with avatars and details  
✅ **Statistics**: Total teachers, active count, roles count  

## File Location

`admin/teachers.html`

---

**Last Updated:** 2026-05-25

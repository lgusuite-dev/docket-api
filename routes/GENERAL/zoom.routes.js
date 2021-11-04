const express = require("express");

const zoomCntrl = require("../../controllers/ZOOM/zoom.controller");

const router = express.Router();

router.post("/signature", zoomCntrl.createSignature);
router.post("/createMeeting", zoomCntrl.createMeeting);
router.get("/getAllMeetings", zoomCntrl.getAllMeetings);
router.get("/getMeeting/:meetingId", zoomCntrl.getMeeting);
router.get("/deleteMeeting/:meetingId", zoomCntrl.deleteMeeting);

module.exports = router;
